export class ValidationError extends Error {
  readonly fields: string | undefined;

  constructor(message: string, fields?: string) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
