package org.example.exampleapi.controller

import org.slf4j.LoggerFactory
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class PrivateController {

    private val logger = LoggerFactory.getLogger(PrivateController::class.java)

    @GetMapping("/me")
    fun me(@AuthenticationPrincipal jwt: Jwt): Map<String, Any?> {
        logger.debug("User info requested for: {}", jwt.subject)
        return mapOf(
            "sub" to jwt.subject,
            "email" to jwt.getClaimAsString("email"),
            "name" to jwt.getClaimAsString("name"),
            "picture" to jwt.getClaimAsString("picture"),
            "groups" to jwt.getClaimAsStringList("https://ns/groups"),
            "issuer" to jwt.issuer?.toString(),
            "issuedAt" to jwt.issuedAt?.toString(),
            "expiresAt" to jwt.expiresAt?.toString()
        )
    }

    @GetMapping("/protected")
    fun protected(@AuthenticationPrincipal jwt: Jwt): Map<String, Any> {
        logger.debug("Protected endpoint accessed by: {}", jwt.subject)
        return mapOf(
            "message" to "This is a protected endpoint",
            "user" to (jwt.subject ?: "unknown"),
            "authenticated" to true
        )
    }
}
