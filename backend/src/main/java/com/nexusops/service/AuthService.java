package com.nexusops.service;

import com.nexusops.config.JwtService;
import com.nexusops.config.TenantContext;
import com.nexusops.dto.AuthDTOs;
import com.nexusops.model.Organization;
import com.nexusops.model.OrganizationMember;
import com.nexusops.model.User;
import com.nexusops.repository.OrganizationMemberRepository;
import com.nexusops.repository.OrganizationRepository;
import com.nexusops.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository memberRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Find primary organization membership
        List<OrganizationMember> memberships = memberRepository.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new RuntimeException("User has no associated organization");
        }

        OrganizationMember primaryMember = memberships.get(0);
        Organization org = primaryMember.getOrganization();

        String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), org.getId(), primaryMember.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        auditService.recordAudit(org.getId(), user.getId(), "USER", "LOGIN_SUCCESS", "USER", user.getId().toString(), "{}");

        return AuthDTOs.LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(86400)
                .user(AuthDTOs.UserDTO.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .displayName(user.getDisplayName())
                        .role(primaryMember.getRole())
                        .build())
                .organization(AuthDTOs.OrganizationDTO.builder()
                        .id(org.getId())
                        .name(org.getName())
                        .slug(org.getSlug())
                        .plan(org.getPlan())
                        .autonomousMode(org.getAutonomousMode())
                        .build())
                .build();
    }
}
