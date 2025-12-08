package org.example.exampleapi.controller

import jakarta.validation.Valid
import org.example.exampleapi.dto.CreateItemRequest
import org.example.exampleapi.dto.ItemResponse
import org.example.exampleapi.dto.UpdateItemRequest
import org.example.exampleapi.service.ItemService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/items")
class ItemController(private val itemService: ItemService) {

    @GetMapping
    fun findAll(pageable: Pageable): ResponseEntity<Page<ItemResponse>> {
        val page = itemService.findAll(pageable)
        return ResponseEntity.ok()
            .header("X-Total-Count", page.totalElements.toString())
            .header("X-Page-Number", page.number.toString())
            .body(page)
    }

    @GetMapping("/{id}")
    fun findById(@PathVariable id: Long): ItemResponse = itemService.findById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateItemRequest): ItemResponse = itemService.create(request)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @Valid @RequestBody request: UpdateItemRequest): ItemResponse =
        itemService.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: Long) = itemService.delete(id)
}
