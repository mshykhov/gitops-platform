package org.example.exampleapi.controller

import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.web.bind.annotation.*
import java.net.InetAddress
import java.time.Instant
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/api/cache-test")
class CacheTestController(private val redisTemplate: StringRedisTemplate) {

    private val logger = LoggerFactory.getLogger(CacheTestController::class.java)
    private val podName: String = System.getenv("HOSTNAME") ?: InetAddress.getLocalHost().hostName

    @GetMapping("/pod")
    fun getPodInfo(): PodInfoResponse {
        logger.debug("Pod info requested")
        return PodInfoResponse(
            podName = podName,
            timestamp = Instant.now().toString()
        )
    }

    @PostMapping("/set")
    fun setValue(@Valid @RequestBody request: SetValueRequest): CacheResponse {
        val ttlSeconds = request.ttl ?: 60
        logger.info("Setting cache key: {} with TTL: {}s", request.key, ttlSeconds)
        redisTemplate.opsForValue().set("test:${request.key}", request.value, ttlSeconds, TimeUnit.SECONDS)
        return CacheResponse(
            action = "SET",
            key = request.key,
            value = request.value,
            ttl = ttlSeconds,
            podName = podName,
            timestamp = Instant.now().toString()
        )
    }

    @GetMapping("/get/{key}")
    fun getValue(@PathVariable key: String): CacheResponse {
        logger.debug("Getting cache key: {}", key)
        val value = redisTemplate.opsForValue().get("test:$key")
        return CacheResponse(
            action = "GET",
            key = key,
            value = value,
            podName = podName,
            timestamp = Instant.now().toString()
        )
    }

    @DeleteMapping("/delete/{key}")
    fun deleteValue(@PathVariable key: String): CacheResponse {
        logger.info("Deleting cache key: {}", key)
        val deleted = redisTemplate.delete("test:$key")
        return CacheResponse(
            action = "DELETE",
            key = key,
            value = if (deleted) "deleted" else "not found",
            podName = podName,
            timestamp = Instant.now().toString()
        )
    }

    @GetMapping("/keys")
    fun getAllKeys(): KeysResponse {
        logger.debug("Getting all cache keys")
        val keys = redisTemplate.keys("test:*").map { it.removePrefix("test:") }
        return KeysResponse(
            keys = keys.toList(),
            count = keys.size,
            podName = podName,
            timestamp = Instant.now().toString()
        )
    }
}

data class SetValueRequest(
    @field:NotBlank(message = "Key is required")
    val key: String,

    @field:NotBlank(message = "Value is required")
    val value: String,

    @field:Positive(message = "TTL must be positive")
    val ttl: Long? = 60
)

data class CacheResponse(
    val action: String,
    val key: String,
    val value: String?,
    val ttl: Long? = null,
    val podName: String,
    val timestamp: String
)

data class PodInfoResponse(
    val podName: String,
    val timestamp: String
)

data class KeysResponse(
    val keys: List<String>,
    val count: Int,
    val podName: String,
    val timestamp: String
)
