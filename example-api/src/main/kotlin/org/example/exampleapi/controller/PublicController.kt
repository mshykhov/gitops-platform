package org.example.exampleapi.controller

import org.example.exampleapi.config.AppProperties
import org.slf4j.LoggerFactory
import org.springframework.boot.info.BuildProperties
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@RestController
@RequestMapping("/api/public")
class PublicController(
    private val buildProperties: BuildProperties,
    private val appProperties: AppProperties
) {
    private val logger = LoggerFactory.getLogger(PublicController::class.java)

    @GetMapping("/health")
    fun health(): Map<String, String> {
        logger.debug("Health check requested")
        return mapOf("status" to "ok")
    }

    @GetMapping("/info")
    fun info(): Map<String, Any> {
        logger.debug("Info requested")
        return mapOf(
            "name" to buildProperties.name,
            "version" to appProperties.version,
            "environment" to (System.getenv("ENVIRONMENT") ?: "local")
        )
    }

    @GetMapping("/time")
    fun time(): Map<String, Any> {
        logger.debug("Time requested")
        val now = Instant.now()
        return mapOf(
            "timestamp" to now.toEpochMilli(),
            "iso" to DateTimeFormatter.ISO_INSTANT.format(now),
            "timezone" to ZoneId.systemDefault().id
        )
    }
}