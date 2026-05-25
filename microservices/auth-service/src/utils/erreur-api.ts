export class ErreurApi extends Error {
  public readonly statutHttp: number;
  public readonly statusCode: number;

  constructor(message: string, statutHttp?: number);
  constructor(statutHttp: number, message: string);
  constructor(messageOuStatut: string | number, statutOuMessage: number | string = 400) {
    const statutHttp =
      typeof messageOuStatut === "number"
        ? messageOuStatut
        : typeof statutOuMessage === "number"
          ? statutOuMessage
          : 400;
    const message =
      typeof messageOuStatut === "string"
        ? messageOuStatut
        : typeof statutOuMessage === "string"
          ? statutOuMessage
          : "Une erreur interne est survenue.";

    super(message);
    this.name = "ErreurApi";
    this.statutHttp = statutHttp;
    this.statusCode = statutHttp;
  }
}
