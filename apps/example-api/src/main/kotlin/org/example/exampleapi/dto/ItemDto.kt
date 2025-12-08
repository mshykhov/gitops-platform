package org.example.exampleapi.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.example.exampleapi.entity.Item
import java.time.Instant

data class ItemResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class CreateItemRequest(
    @field:NotBlank(message = "Name is required")
    @field:Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
    val name: String,

    @field:Size(max = 5000, message = "Description must not exceed 5000 characters")
    val description: String? = null
)

data class UpdateItemRequest(
    @field:NotBlank(message = "Name is required")
    @field:Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
    val name: String,

    @field:Size(max = 5000, message = "Description must not exceed 5000 characters")
    val description: String? = null
)

fun Item.toResponse() = ItemResponse(
    id = id!!,
    name = name,
    description = description,
    createdAt = createdAt!!,
    updatedAt = updatedAt!!
)
