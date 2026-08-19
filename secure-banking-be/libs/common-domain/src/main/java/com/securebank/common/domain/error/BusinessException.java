package com.securebank.common.domain.error;

public class BusinessException extends RuntimeException {

    private final ErrorCode code;
    private final int httpStatus;

    public BusinessException(ErrorCode code, String message, int httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public ErrorCode getCode() {
        return code;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public static BusinessException notFound(ErrorCode code, String message) {
        return new BusinessException(code, message, 404);
    }

    public static BusinessException conflict(ErrorCode code, String message) {
        return new BusinessException(code, message, 409);
    }

    public static BusinessException forbidden(ErrorCode code, String message) {
        return new BusinessException(code, message, 403);
    }

    public static BusinessException unprocessable(ErrorCode code, String message) {
        return new BusinessException(code, message, 422);
    }

    public static BusinessException badRequest(ErrorCode code, String message) {
        return new BusinessException(code, message, 400);
    }
}
