package app

import (
	"chat/internal/config"
	"chat/internal/domain"
	"chat/internal/utils"
	"html/template"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
)

func (a *App) chatHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	chatID := mux.Vars(r)["id"]

	// Получаем информацию о чате
	chat, err := a.storage.GetChatByID(utils.Atoi(chatID))
	if err != nil {
		log.Printf("chatHandler: storage.GetChatByID: %v", err)
		http.Error(w, "Ошибка получения чата", http.StatusInternalServerError)
		return
	} else if chat == nil {
		http.NotFound(w, r)
		return
	}

	// Получаем сообщения чата
	messages, err := a.storage.GetMessagesByChatID(utils.Atoi(chatID))
	if err != nil {
		log.Printf("chatHandler: GetMessagesByChatID: %v", err)
		http.Error(w, "Ошибка получения сообщений", http.StatusInternalServerError)
		return
	}
	for i, message := range messages {
		decrypted, err := a.cipher.Decrypt(message.Content)
		if err != nil {
			log.Printf("chatHandler: cipher.Decrypt: %v", err)
			messages[i].Content = "[ошибка расшифровки]"
		} else {
			messages[i].Content = decrypted
		}
	}

	// Получаем участников чата
	participants, err := a.storage.GetChatMembersByChatID(utils.Atoi(chatID))
	if err != nil {
		log.Printf("chatHandler: storage.GetChatMembersByChatID: %v", err)
		http.Error(w, "Ошибка получения участников чата", http.StatusInternalServerError)
		return
	}

	// Получаем текущего пользователя
	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	currentUserID, err := a.storage.GetUserIDByUsername(username)
	if err != nil {
		log.Printf("chatHandler: storage.GetUserIDByUsername: %v", err)
		http.Error(w, "Ошибка получения текущего пользователя", http.StatusInternalServerError)
		return
	}

	// Если чат личный, изменяем название на имя другого участника
	if chat.IsPrivate {
		for _, participant := range participants {
			if participant.ID != currentUserID {
				chat.Name = participant.Surname + " " + participant.Name + " " + participant.Patronymic
				break
			}
		}
	}

	tmpl := template.Must(template.ParseFiles(filepath.Join(config.TemplatesDirPath, "chat.html")))
	err = tmpl.Execute(w, struct {
		Chat          domain.Chat
		Messages      []domain.Message
		Participants  []domain.User
		Username      string
		CurrentUserID int // Добавлено поле для текущего пользователя
	}{
		Chat:          *chat,
		Messages:      messages,
		Participants:  participants,
		Username:      username,
		CurrentUserID: currentUserID, // Передаем ID текущего пользователя
	})
	if err != nil {
		log.Printf("chatHandler: tmpl.Execute: %v", err)
	}

	err = a.storage.UpdateLastChatVisitTime(chat.ID, currentUserID)
	if err != nil {
		log.Printf("chatHandler: storage.UpdateLastChatVisitTime: %v", err)
	}
}
