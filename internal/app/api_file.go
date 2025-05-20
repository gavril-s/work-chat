package app

import (
	"chat/internal/domain"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

// API File handler
func (a *App) apiFileHandler(w http.ResponseWriter, r *http.Request) {
	if !a.isAuthenticated(r) {
		sendJSONResponse(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	messageID := mux.Vars(r)["id"]

	var message domain.Message
	err := a.storage.GetMessageByID(messageID, &message)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Decode base64 data
	data, err := base64.StdEncoding.DecodeString(strings.Split(message.File.Data, ",")[1])
	if err != nil {
		http.Error(w, "Invalid file data", http.StatusInternalServerError)
		return
	}

	// Set headers
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", message.File.Name))
	w.Header().Set("Content-Type", http.DetectContentType(data))
	w.Write(data)
}
