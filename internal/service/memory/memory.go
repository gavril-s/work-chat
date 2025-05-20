package memory

import (
	"chat/internal/config"
	"chat/internal/domain"
	"net/http"

	"github.com/gorilla/sessions"
)

type Service struct {
	cookies *sessions.CookieStore
	clients map[domain.Client]bool
}

func NewService(cfg *config.Config) *Service {
	store := sessions.NewCookieStore([]byte(cfg.CookiesSecretKey))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}
	return &Service{
		cookies: store,
		clients: make(map[domain.Client]bool),
	}
}

func (s *Service) GetSession(r *http.Request, name string) (*sessions.Session, error) {
	return s.cookies.Get(r, name)
}

func (s *Service) GetClientsByChatID(chatID int) []domain.Client {
	res := make([]domain.Client, 0)
	for client, present := range s.clients {
		if client.ChatID == chatID && present {
			res = append(res, client)
		}
	}
	return res
}

func (s *Service) DeleteClient(client domain.Client) {
	delete(s.clients, client)
}

func (s *Service) AddClient(client domain.Client) {
	s.clients[client] = true
}
