package app

import (
	"chat/internal/domain"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

// API response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// Login request structure
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Register request structure
type RegisterRequest struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	Name       string `json:"name"`
	Surname    string `json:"surname"`
	Patronymic string `json:"patronymic"`
}

// Create chat request structure
type CreateChatRequest struct {
	Name    string `json:"name"`
	UserIDs []int  `json:"user_ids"`
}

// Edit message request structure
type EditMessageRequest struct {
	MessageID string `json:"message_id"`
	Content   string `json:"content"`
	ChatID    string `json:"chat_id"`
}

// Delete message request structure
type DeleteMessageRequest struct {
	MessageID string `json:"message_id"`
	ChatID    string `json:"chat_id"`
}

// Send JSON response helper
func sendJSONResponse(w http.ResponseWriter, statusCode int, response APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

// API Login handler
func (a *App) apiLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	user, err := a.storage.GetUserByUsername(req.Username)
	if err != nil {
		log.Printf("apiLoginHandler: storage.GetUserByUsername: %v", err)
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		log.Printf("apiLoginHandler: bcrypt.CompareHashAndPassword: %v", err)
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	session.Values["username"] = req.Username
	err = session.Save(r, w)
	if err != nil {
		log.Printf("apiLoginHandler: session.Save: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error saving session",
		})
		return
	}

	err = a.storage.UpdateUserStatus(req.Username, "online")
	if err != nil {
		log.Printf("apiLoginHandler: storage.UpdateUserStatus: %v", err)
	}

	sendJSONResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Message: "Login successful",
		Data: map[string]interface{}{
			"user_id":   user.ID,
			"username":  user.Username,
			"full_name": user.Surname + " " + user.Name + " " + user.Patronymic,
		},
	})
}

// API Register handler
func (a *App) apiRegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	// Validate input
	if req.Username == "" || req.Password == "" || req.Name == "" || req.Surname == "" {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "All fields are required",
		})
		return
	}

	// Check if username already exists
	_, err := a.storage.GetUserByUsername(req.Username)
	if err == nil {
		sendJSONResponse(w, http.StatusConflict, APIResponse{
			Success: false,
			Message: "Username already exists",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("apiRegisterHandler: bcrypt.GenerateFromPassword: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error processing request",
		})
		return
	}

	// Create user
	user := domain.User{
		Username:   req.Username,
		Password:   string(hashedPassword),
		Name:       req.Name,
		Surname:    req.Surname,
		Patronymic: req.Patronymic,
		Status:     "offline",
		LastActive: time.Now(),
	}

	err = a.storage.InsertUser(user)
	if err != nil {
		log.Printf("apiRegisterHandler: storage.InsertUser: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error creating user",
		})
		return
	}

	sendJSONResponse(w, http.StatusCreated, APIResponse{
		Success: true,
		Message: "User registered successfully",
	})
}

// API Logout handler
func (a *App) apiLogoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := a.memory.GetSession(r, "session-name")
	username, ok := session.Values["username"].(string)
	if ok {
		err := a.storage.UpdateUserStatus(username, "offline")
		if err != nil {
			log.Printf("apiLogoutHandler: storage.UpdateUserStatus: %v", err)
		}
	}

	session.Values["username"] = nil
	session.Options.MaxAge = -1
	err := session.Save(r, w)
	if err != nil {
		log.Printf("apiLogoutHandler: session.Save: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error during logout",
		})
		return
	}

	sendJSONResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Message: "Logged out successfully",
	})
}

// API Get Chats handler
func (a *App) apiChatsHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	user, err := a.storage.GetUserByUsername(username)
	if err != nil {
		log.Printf("apiChatsHandler: storage.GetUserByUsername: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving user",
		})
		return
	}

	chats, err := a.storage.GetChatsByUserID(user.ID)
	if err != nil {
		log.Printf("apiChatsHandler: storage.GetChatsByUserID: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving chats",
		})
		return
	}

	// Count unread messages for each chat
	for i, chat := range chats {
		chats[i].UnreadMessageCount, err = a.storage.CountUnreadMessages(chat.ID, user.ID, chat.LastVisit)
		if err != nil {
			log.Printf("apiChatsHandler: storage.CountUnreadMessages: %v", err)
			chats[i].UnreadMessageCount = 0
		}
	}

	sendJSONResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"chats": chats,
			"user": map[string]interface{}{
				"id":        user.ID,
				"username":  user.Username,
				"full_name": user.Surname + " " + user.Name + " " + user.Patronymic,
			},
		},
	})
}

// API Get Chat handler
func (a *App) apiChatHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	vars := mux.Vars(r)
	chatID, err := strconv.Atoi(vars["id"])
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid chat ID",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	user, err := a.storage.GetUserByUsername(username)
	if err != nil {
		log.Printf("apiChatHandler: storage.GetUserByUsername: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving user",
		})
		return
	}

	chat, err := a.storage.GetChatByID(chatID)
	if err != nil {
		log.Printf("apiChatHandler: storage.GetChatByID: %v", err)
		sendJSONResponse(w, http.StatusNotFound, APIResponse{
			Success: false,
			Message: "Chat not found",
		})
		return
	}

	messages, err := a.storage.GetMessagesByChatID(chatID)
	if err != nil {
		log.Printf("apiChatHandler: storage.GetMessagesByChatID: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving messages",
		})
		return
	}

	// Decrypt message content
	for i := range messages {
		decryptedContent, err := a.cipher.Decrypt(messages[i].Content)
		if err != nil {
			log.Printf("apiChatHandler: cipher.Decrypt: %v", err)
			// Continue with other messages even if one fails to decrypt
			continue
		}
		messages[i].Content = decryptedContent
	}

	members, err := a.storage.GetChatMembersByChatID(chatID)
	if err != nil {
		log.Printf("apiChatHandler: storage.GetChatMembersByChatID: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving chat members",
		})
		return
	}

	// Update last visit time
	err = a.storage.UpdateLastChatVisitTime(chatID, user.ID)
	if err != nil {
		log.Printf("apiChatHandler: storage.UpdateLastChatVisitTime: %v", err)
	}

	sendJSONResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"chat":     chat,
			"messages": messages,
			"members":  members,
			"user_id":  user.ID,
			"username": user.Username,
		},
	})
}

// API Create Private Chat handler
func (a *App) apiCreatePrivateChatHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	var req struct {
		UserID int `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	currentUserID, err := a.storage.GetUserIDByUsername(username)
	if err != nil {
		log.Printf("apiCreatePrivateChatHandler: storage.GetUserIDByUsername: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving user",
		})
		return
	}

	// Check if chat already exists
	existingChatID, err := a.storage.GetChatIDByUserIDs(currentUserID, req.UserID)
	if err == nil {
		// Chat already exists, return its ID
		sendJSONResponse(w, http.StatusOK, APIResponse{
			Success: true,
			Message: "Chat already exists",
			Data: map[string]interface{}{
				"chat_id": existingChatID,
			},
		})
		return
	}

	// Get other user's info
	otherUser, err := a.storage.GetUserByID(req.UserID)
	if err != nil {
		log.Printf("apiCreatePrivateChatHandler: storage.GetUserByID: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving other user",
		})
		return
	}

	// Create new chat
	chat := domain.Chat{
		Name:      otherUser.Username, // Use other user's username as chat name
		IsPrivate: true,
		CreatorID: currentUserID,
		CreatedAt: time.Now(),
	}

	chatID, err := a.storage.InsertChat(chat)
	if err != nil {
		log.Printf("apiCreatePrivateChatHandler: storage.InsertChat: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error creating chat",
		})
		return
	}

	// Add both users to the chat
	err = a.storage.AddUserToChat(chatID, currentUserID)
	if err != nil {
		log.Printf("apiCreatePrivateChatHandler: storage.AddUserToChat (current): %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error adding current user to chat",
		})
		return
	}

	err = a.storage.AddUserToChat(chatID, req.UserID)
	if err != nil {
		log.Printf("apiCreatePrivateChatHandler: storage.AddUserToChat (other): %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error adding other user to chat",
		})
		return
	}

	sendJSONResponse(w, http.StatusCreated, APIResponse{
		Success: true,
		Message: "Private chat created",
		Data: map[string]interface{}{
			"chat_id": chatID,
		},
	})
}

// API Create Group Chat handler
func (a *App) apiCreateGroupChatHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	var req CreateChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	if req.Name == "" {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Chat name is required",
		})
		return
	}

	if len(req.UserIDs) == 0 {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "At least one user must be selected",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	currentUserID, err := a.storage.GetUserIDByUsername(username)
	if err != nil {
		log.Printf("apiCreateGroupChatHandler: storage.GetUserIDByUsername: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving user",
		})
		return
	}

	// Create new chat
	chat := domain.Chat{
		Name:      req.Name,
		IsPrivate: false,
		CreatorID: currentUserID,
		CreatedAt: time.Now(),
	}

	chatID, err := a.storage.InsertChat(chat)
	if err != nil {
		log.Printf("apiCreateGroupChatHandler: storage.InsertChat: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error creating chat",
		})
		return
	}

	// Add creator to the chat
	err = a.storage.AddUserToChat(chatID, currentUserID)
	if err != nil {
		log.Printf("apiCreateGroupChatHandler: storage.AddUserToChat (creator): %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error adding creator to chat",
		})
		return
	}

	// Add selected users to the chat
	for _, userID := range req.UserIDs {
		err = a.storage.AddUserToChat(chatID, userID)
		if err != nil {
			log.Printf("apiCreateGroupChatHandler: storage.AddUserToChat (user %d): %v", userID, err)
			// Continue adding other users even if one fails
		}
	}

	sendJSONResponse(w, http.StatusCreated, APIResponse{
		Success: true,
		Message: "Group chat created",
		Data: map[string]interface{}{
			"chat_id": chatID,
		},
	})
}

// API Get Users for Chat Creation
func (a *App) apiGetUsersForChatHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	users, err := a.storage.GetAllOtherUsers(username)
	if err != nil {
		log.Printf("apiGetUsersForChatHandler: storage.GetAllOtherUsers: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving users",
		})
		return
	}

	sendJSONResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"users": users,
		},
	})
}

// API Edit Message handler
func (a *App) apiEditMessageHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	var req EditMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	// Check if the user is the message author
	messageID, err := strconv.Atoi(req.MessageID)
	if err != nil {
		log.Printf("apiEditMessageHandler: strconv.Atoi: %v", err)
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid message ID",
		})
		return
	}

	messageAuthor, err := a.storage.GetUsernameByMessageID(messageID)
	if err != nil {
		log.Printf("apiEditMessageHandler: storage.GetUsernameByMessageID: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving message author",
		})
		return
	}

	if messageAuthor != username {
		sendJSONResponse(w, http.StatusForbidden, APIResponse{
			Success: false,
			Message: "You can only edit your own messages",
		})
		return
	}

	// Update message content
	err = a.storage.UpdateMessageContent(req.MessageID, req.Content)
	if err != nil {
		log.Printf("apiEditMessageHandler: storage.UpdateMessageContent: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error updating message",
		})
		return
	}

	// Get the updated message to return
	var message domain.Message
	err = a.storage.GetMessageByID(req.MessageID, &message)
	if err != nil {
		log.Printf("apiEditMessageHandler: storage.GetMessageByID: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving updated message",
		})
		return
	}

	// Decrypt message content
	decryptedContent, err := a.cipher.Decrypt(message.Content)
	if err != nil {
		log.Printf("apiEditMessageHandler: cipher.Decrypt: %v", err)
		// Continue even if decryption fails
	} else {
		message.Content = decryptedContent
	}

	// Get the chat ID from the request
	chatID, err := strconv.Atoi(req.ChatID)
	if err != nil {
		log.Printf("apiEditMessageHandler: strconv.Atoi(req.ChatID): %v", err)
		chatID = message.ChatID // Fallback to the message's chat ID
	}

	// Broadcast the edit to all clients in the chat
	clients := a.memory.GetClientsByChatID(chatID)
	log.Printf("apiEditMessageHandler: Broadcasting edit to %d clients in chat %d", len(clients), chatID)

	editMessage := map[string]interface{}{
		"action":  "edit",
		"id":      req.MessageID,
		"content": decryptedContent,
	}

	for _, client := range clients {
		log.Printf("apiEditMessageHandler: Sending edit message to client %d", client.UserID)
		err := client.Conn.WriteJSON(editMessage)
		if err != nil {
			log.Printf("apiEditMessageHandler: client.Conn.WriteJSON: %v", err)
			// Continue with other clients even if one fails
		} else {
			log.Printf("apiEditMessageHandler: Successfully sent edit message to client %d", client.UserID)
		}
	}

	sendJSONResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Message: "Message updated",
		Data: map[string]interface{}{
			"message": message,
		},
	})
}

// API Delete Message handler
func (a *App) apiDeleteMessageHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	var req DeleteMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	session, _ := a.memory.GetSession(r, "session-name")
	username := session.Values["username"].(string)

	// Check if the user is the message author
	messageID, err := strconv.Atoi(req.MessageID)
	if err != nil {
		log.Printf("apiDeleteMessageHandler: strconv.Atoi: %v", err)
		sendJSONResponse(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid message ID",
		})
		return
	}

	messageAuthor, err := a.storage.GetUsernameByMessageID(messageID)
	if err != nil {
		log.Printf("apiDeleteMessageHandler: storage.GetUsernameByMessageID: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error retrieving message author",
		})
		return
	}

	if messageAuthor != username {
		sendJSONResponse(w, http.StatusForbidden, APIResponse{
			Success: false,
			Message: "You can only delete your own messages",
		})
		return
	}

	// Get message details before deleting it
	var message domain.Message
	err = a.storage.GetMessageByID(req.MessageID, &message)
	if err != nil {
		log.Printf("apiDeleteMessageHandler: storage.GetMessageByID: %v", err)
		// Continue with deletion even if we can't get the message details
	}

	// Delete the message
	err = a.storage.DeleteMessage(req.MessageID)
	if err != nil {
		log.Printf("apiDeleteMessageHandler: storage.DeleteMessage: %v", err)
		sendJSONResponse(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Error deleting message",
		})
		return
	}

	// Get the chat ID from the request or from the message
	chatID, err := strconv.Atoi(req.ChatID)
	if err != nil && message.ChatID > 0 {
		log.Printf("apiDeleteMessageHandler: strconv.Atoi(req.ChatID): %v", err)
		chatID = message.ChatID // Fallback to the message's chat ID
	}

	// Broadcast the deletion to all clients in the chat
	if chatID > 0 {
		clients := a.memory.GetClientsByChatID(chatID)
		log.Printf("apiDeleteMessageHandler: Broadcasting delete to %d clients in chat %d", len(clients), chatID)

		deleteMessage := map[string]interface{}{
			"action": "delete",
			"id":     req.MessageID,
		}

		for _, client := range clients {
			log.Printf("apiDeleteMessageHandler: Sending delete message to client %d", client.UserID)
			err := client.Conn.WriteJSON(deleteMessage)
			if err != nil {
				log.Printf("apiDeleteMessageHandler: client.Conn.WriteJSON: %v", err)
				// Continue with other clients even if one fails
			} else {
				log.Printf("apiDeleteMessageHandler: Successfully sent delete message to client %d", client.UserID)
			}
		}
	}

	sendJSONResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Message: "Message deleted",
		Data: map[string]interface{}{
			"message_id": req.MessageID,
		},
	})
}
