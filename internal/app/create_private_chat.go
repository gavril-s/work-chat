package app

import (
	"chat/internal/config"
	"chat/internal/domain"
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
)

func (a *App) createPrivateChatHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string) // Получаем имя пользователя из сессии

	if r.Method == http.MethodPost {
		userID, err := a.storage.GetUserIDByUsername(username)
		if err != nil {
			log.Printf("createPrivateChatHandler: storage.GetUserIDByUsername: %v", err)
			http.Error(w, "Ошибка получения пользователя", http.StatusInternalServerError)
			return
		}

		userIDToAdd, err := strconv.Atoi(r.FormValue("user_id"))
		if err != nil {
			log.Printf("createPrivateChatHandler: strconv.Atoi: %v", err)
			http.Error(w, "Ошибка получения ID пользователя", http.StatusBadRequest)
			return
		}

		// Проверяем, существует ли уже чат между этими пользователями
		existingChatID, err := a.storage.GetChatIDByUserIDs(userID, userIDToAdd)
		if err != sql.ErrNoRows {
			// Ошибка при выполнении запроса
			log.Printf("createPrivateChatHandler: storage.GetChatIDByUserIDs: %v", err)
			http.Error(w, "Ошибка проверки существующих чатов", http.StatusInternalServerError)
			return
		}
		if existingChatID != 0 {
			// Чат уже существует
			http.Error(w, "Личный чат с этим пользователем уже существует", http.StatusConflict)
			return
		}

		// Получаем ФИО второго пользователя
		userToAdd, err := a.storage.GetUserByID(userIDToAdd)
		if err != nil {
			log.Printf("createPrivateChatHandler: storage.GetUserByID: %v", err)
			http.Error(w, "Ошибка получения данных собеседника", http.StatusInternalServerError)
			return
		}

		// Название чата будет ФИО собеседника
		chatName := fmt.Sprintf("%s %s", userToAdd.Name, userToAdd.Surname)

		// Создаем новый личный чат
		chat := domain.Chat{
			Name:      chatName,
			IsPrivate: true,
			CreatorID: userID,
		}
		chat.ID, err = a.storage.InsertChat(chat)
		if err != nil {
			log.Printf("createPrivateChatHandler: storage.InsertChat: %v", err)
			http.Error(w, "Ошибка создания чата", http.StatusInternalServerError)
			return
		}

		// Добавляем создателя и другого пользователя в таблицу chat_users
		err = a.storage.AddUserToChat(chat.ID, userID)
		if err != nil {
			log.Printf("createPrivateChatHandler: storage.AddUserToChat: %v", err)
			http.Error(w, "Ошибка добавления пользователей в чат", http.StatusInternalServerError)
			return
		}
		err = a.storage.AddUserToChat(chat.ID, userIDToAdd)
		if err != nil {
			log.Printf("createPrivateChatHandler: storage.AddUserToChat: %v", err)
			http.Error(w, "Ошибка добавления пользователей в чат", http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/chats", http.StatusSeeOther)
		return
	}

	// Получаем всех пользователей для выбора, исключая текущего пользователя
	users, err := a.storage.GetAllOtherUsers(username)
	if err != nil {
		log.Printf("createPrivateChatHandler: storage.GetAllOtherUsers: %v", err)
		http.Error(w, "Ошибка получения пользователей", http.StatusInternalServerError)
		return
	}
	for i, user := range users {
		users[i].Name = fmt.Sprintf("%s %s %s", user.Surname, user.Name, user.Patronymic)
	}

	tmpl := template.Must(template.ParseFiles(filepath.Join(config.TemplatesDirPath, "create_private_chat.html")))
	err = tmpl.Execute(w, struct {
		Users []domain.User
	}{Users: users})
	if err != nil {
		log.Printf("createPrivateChatHandler: tmpl.Execute: %v", err)
	}
}
