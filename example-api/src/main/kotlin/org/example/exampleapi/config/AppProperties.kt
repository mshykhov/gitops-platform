package org.example.exampleapi.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
    val version: String = "0.0.1-SNAPSHOT",
    val cors: CorsProperties = CorsProperties()
) {
    data class CorsProperties(
        val allowedOrigins: List<String> = emptyList()
    )
}
