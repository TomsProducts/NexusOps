package com.nexusops.repository;

import com.nexusops.model.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    List<OrganizationMember> findByOrganizationId(UUID organizationId);
    List<OrganizationMember> findByUserId(UUID userId);
    Optional<OrganizationMember> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}
