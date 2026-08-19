package com.securebank.common.web.error;

import com.securebank.common.domain.error.BusinessException;
import com.securebank.common.domain.error.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.Optional;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(BusinessException ex, HttpServletRequest request) {
        log.warn("Business error code={} status={} path={} message={}",
                ex.getCode(), ex.getHttpStatus(), request.getRequestURI(), ex.getMessage());
        return build(ex.getHttpStatus(), ex.getCode().name(), ex.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(403, ErrorCode.ACCESS_DENIED.name(),
                "You are not authorized to access this resource", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuth(AuthenticationException ex, HttpServletRequest request) {
        return build(401, ErrorCode.UNAUTHENTICATED.name(), "Authentication is required", request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(400, ErrorCode.VALIDATION_ERROR.name(), message, request);
    }

    @ExceptionHandler({ConstraintViolationException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> handleConstraint(Exception ex, HttpServletRequest request) {
        return build(400, ErrorCode.VALIDATION_ERROR.name(), ex.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error path={}", request.getRequestURI(), ex);
        return build(500, ErrorCode.INTERNAL_ERROR.name(), "An unexpected error occurred", request);
    }

    private ResponseEntity<ApiError> build(int status, String code, String message, HttpServletRequest request) {
        String traceId = Optional.ofNullable(MDC.get("traceId")).orElse(MDC.get("correlationId"));
        ApiError body = new ApiError(Instant.now(), status, code, message, traceId, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.valueOf(status)).body(body);
    }
}
