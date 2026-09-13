# Backend security baseline

- Provider API keys are read only from server environment variables.
- Browser requests contain no provider credentials.
- Symbol and interval inputs are allow-listed/validated.
- Provider errors are sanitized before reaching the browser.
- CORS can be restricted to one or more frontend origins.
- Responses use `Cache-Control: no-store` for market and health data.
- GitHub Pages detects an unconfigured backend and remains in safe simulated mode.
