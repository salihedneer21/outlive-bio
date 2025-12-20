src/middleware/requestLogger.ts is just wiring up the morgan HTTP logger:

  import morgan from 'morgan';

  export const requestLogger = morgan('dev');

  How it works:

  - morgan('dev') returns an Express middleware function.
  - In src/app.ts, app.use(requestLogger); runs it for every request before your routes.
  - For each completed response, it logs a single line like: GET /api/users 200 12 ms - 123, using
    colors and a short “dev” format.
  - If the response has an error status (e.g. 404, 500), morgan logs that status code; it does not
    handle the error itself, it only logs.

  How errors are actually handled in this app:

  - notFoundHandler (src/middleware/notFoundHandler.ts) sends a 404 JSON response when no route
    matches.
  - errorHandler (src/middleware/errorHandler.ts) is the Express error middleware; when a route/
    middleware calls next(err) or throws, Express calls this:
      - It logs the error with logger.error(err) (which prints [ERROR] ... to the console).
      - It responds with 500 and JSON { message: 'Internal server error' }.

  So:

  - requestLogger (morgan) logs every request/response, including error status codes.
  - errorHandler plus logger handle and log the actual application errors.