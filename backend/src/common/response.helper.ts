export class ResponseHelper {
  static success(message: string, data: any = null, meta: any = null) {
    return {
      success: true,
      message,
      data,
      meta: meta ?? null,
    };
  }

  static error(message: string, code: string, details: any = []) {
    return {
      success: false,
      message,
      error: {
        code,
        details,
      },
    };
  }
}
