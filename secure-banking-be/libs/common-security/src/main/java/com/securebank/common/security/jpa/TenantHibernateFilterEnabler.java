package com.securebank.common.security.jpa;

import com.securebank.common.security.tenant.TenantContext;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

@Component
public class TenantHibernateFilterEnabler {

    public static final String FILTER_NAME = "tenantFilter";
    public static final String PARAM = "tenantId";

    public void enable(EntityManager entityManager) {
        String tenantId = TenantContext.get();
        if (tenantId == null || "PLATFORM".equals(tenantId)) {
            return;
        }
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter(FILTER_NAME).setParameter(PARAM, tenantId);
    }
}
