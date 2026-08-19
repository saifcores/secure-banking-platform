package com.securebank.common.security.jpa;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    private final TenantHibernateFilterEnabler enabler;

    public TenantFilterAspect(TenantHibernateFilterEnabler enabler) {
        this.enabler = enabler;
    }

    @Before("execution(* org.springframework.data.repository.Repository+.*(..))")
    public void enableFilter(JoinPoint joinPoint) {
        if (TenantFilterBypass.isActive()) {
            return;
        }
        if (entityManager != null && entityManager.isOpen()) {
            enabler.enable(entityManager);
        }
    }
}
