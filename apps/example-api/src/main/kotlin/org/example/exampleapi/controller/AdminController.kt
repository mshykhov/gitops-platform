package org.example.exampleapi.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin")
class AdminController {

    @GetMapping("/stats")
    @PreAuthorize("hasRole('admin')")
    fun stats(@AuthenticationPrincipal jwt: Jwt): Map<String, Any> {
        return mapOf(
            "message" to "Admin-only statistics endpoint",
            "admin" to (jwt.subject ?: "unknown"),
            "serverTime" to System.currentTimeMillis(),
            "jvmMemory" to mapOf(
                "total" to Runtime.getRuntime().totalMemory(),
                "free" to Runtime.getRuntime().freeMemory(),
                "used" to (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory())
            ),
            "activeThreads" to Thread.activeCount()
        )
    }
}