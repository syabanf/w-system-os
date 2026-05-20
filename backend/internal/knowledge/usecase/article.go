package usecase

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/knowledge/domain"
)

type ArticleService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewArticleService(repo domain.Repository) *ArticleService {
	return &ArticleService{repo: repo, now: time.Now}
}

type WriteInput struct {
	TenantID     uuid.UUID
	CategoryID   *uuid.UUID
	Title        string
	Slug         string
	Excerpt      string
	BodyMarkdown string
	AuthorID     *uuid.UUID
	Status       domain.Status
	Pinned       bool
}

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

// Slugify is exported so callers can derive a slug client-side if they want.
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugRe.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func (s *ArticleService) Create(ctx context.Context, in WriteInput) (*domain.Article, error) {
	if in.Status == "" {
		in.Status = domain.StatusDraft
	}
	if strings.TrimSpace(in.Slug) == "" {
		in.Slug = Slugify(in.Title)
	}
	now := s.now()
	var publishedAt *time.Time
	if in.Status == domain.StatusPublished {
		publishedAt = &now
	}
	a := &domain.Article{
		ID:           uuid.New(),
		TenantID:     in.TenantID,
		CategoryID:   in.CategoryID,
		Title:        strings.TrimSpace(in.Title),
		Slug:         in.Slug,
		Excerpt:      in.Excerpt,
		BodyMarkdown: in.BodyMarkdown,
		AuthorID:     in.AuthorID,
		Status:       in.Status,
		Pinned:       in.Pinned,
		PublishedAt:  publishedAt,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := a.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *ArticleService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Article, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *ArticleService) List(ctx context.Context, f domain.Filter) ([]*domain.Article, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *ArticleService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Article, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	existing.CategoryID = in.CategoryID
	existing.Title = strings.TrimSpace(in.Title)
	if in.Slug != "" {
		existing.Slug = in.Slug
	}
	existing.Excerpt = in.Excerpt
	existing.BodyMarkdown = in.BodyMarkdown
	existing.AuthorID = in.AuthorID
	if in.Status != "" {
		// Stamp publishedAt on the first transition to published.
		if existing.Status != domain.StatusPublished && in.Status == domain.StatusPublished {
			now := s.now()
			existing.PublishedAt = &now
		}
		existing.Status = in.Status
	}
	existing.Pinned = in.Pinned
	existing.UpdatedAt = s.now()

	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *ArticleService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
