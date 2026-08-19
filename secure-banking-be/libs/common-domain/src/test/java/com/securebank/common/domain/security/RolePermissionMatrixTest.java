package com.securebank.common.domain.security;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RolePermissionMatrixTest {

    @Test
    void customerCanCreateTransactionButNotCancelOrAudit() {
        Set<Permission> permissions = Role.CUSTOMER.permissions();
        assertThat(permissions).contains(Permission.TRANSACTION_CREATE, Permission.ACCOUNT_READ);
        assertThat(permissions).doesNotContain(Permission.TRANSACTION_CANCEL, Permission.AUDIT_READ,
                Permission.ACCOUNT_CREATE);
    }

    @Test
    void operatorCanCreateAccountAndCancelTransaction() {
        Set<Permission> permissions = Role.OPERATOR.permissions();
        assertThat(permissions).contains(
                Permission.ACCOUNT_CREATE,
                Permission.TRANSACTION_CANCEL,
                Permission.CUSTOMER_UPDATE);
        assertThat(permissions).doesNotContain(Permission.AUDIT_READ);
    }

    @Test
    void auditorCanOnlyReadAudit() {
        assertThat(Role.AUDITOR.permissions()).containsExactly(Permission.AUDIT_READ);
    }

    @Test
    void adminHasEveryPermission() {
        assertThat(Role.ADMIN.permissions()).containsExactlyInAnyOrder(Permission.values());
    }

    @Test
    void supportCannotMutateAccountsOrTransactions() {
        Set<Permission> permissions = Role.SUPPORT.permissions();
        assertThat(permissions).contains(Permission.ACCOUNT_READ, Permission.CUSTOMER_READ);
        assertThat(permissions).doesNotContain(
                Permission.ACCOUNT_CREATE,
                Permission.TRANSACTION_CREATE,
                Permission.TRANSACTION_CANCEL);
    }
}
