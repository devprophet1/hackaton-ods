export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Responde { message } en español. Solo registra el mensaje del error, nunca el cuerpo de la petición.
export function errorHandler(err, req, res, _next) {
  const status = err.status || (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) console.error(`[${req.method} ${req.path}]`, err.message);
  const message = status === 413
    ? 'El archivo o el mensaje es demasiado grande.'
    : status >= 500 && !(err instanceof HttpError)
      ? 'Ocurrió un error en el servidor. Inténtalo de nuevo.'
      : err.message;
  res.status(status).json({ message });
}
