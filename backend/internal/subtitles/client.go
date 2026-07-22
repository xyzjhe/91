package subtitles

import "context"

// Request contains only catalog metadata that is safe to send to an anonymous
// subtitle lookup service. It is deliberately independent from drive types and
// credentials.
type Request struct {
	FileID          string
	FileName        string
	LookupNames     []string
	ContentHash     string
	SampledSHA256   string
	DurationSeconds int
}

// Subtitle is an online subtitle candidate returned by a Client.
type Subtitle struct {
	ID              string
	Name            string
	Ext             string
	Language        string
	URL             string
	Source          int
	SourceLabel     string
	DurationSeconds int
}

// Client fetches online subtitle candidates without depending on a mounted
// storage drive.
type Client interface {
	Subtitles(ctx context.Context, req Request) ([]Subtitle, error)
}
