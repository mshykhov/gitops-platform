package org.example.exampleapi.service

import org.example.exampleapi.dto.CreateItemRequest
import org.example.exampleapi.dto.ItemResponse
import org.example.exampleapi.dto.UpdateItemRequest
import org.example.exampleapi.dto.toResponse
import org.example.exampleapi.entity.Item
import org.example.exampleapi.exception.EntityNotFoundException
import org.example.exampleapi.repository.ItemRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ItemService(private val itemRepository: ItemRepository) {

    private val logger = LoggerFactory.getLogger(ItemService::class.java)

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<ItemResponse> {
        logger.debug("Fetching items with pageable: {}", pageable)
        return itemRepository.findAll(pageable).map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): ItemResponse {
        logger.debug("Fetching item by id: {}", id)
        return findItemById(id).toResponse()
    }

    fun create(request: CreateItemRequest): ItemResponse {
        logger.info("Creating item with name: {}", request.name)
        val item = Item(name = request.name, description = request.description)
        val saved = itemRepository.save(item)
        logger.info("Created item with id: {}", saved.id)
        return saved.toResponse()
    }

    fun update(id: Long, request: UpdateItemRequest): ItemResponse {
        logger.info("Updating item with id: {}", id)
        val item = findItemById(id)
        item.name = request.name
        item.description = request.description
        val updated = itemRepository.save(item)
        logger.info("Updated item with id: {}", updated.id)
        return updated.toResponse()
    }

    fun delete(id: Long) {
        logger.info("Deleting item with id: {}", id)
        if (!itemRepository.existsById(id)) {
            throw EntityNotFoundException("Item with id $id not found")
        }
        itemRepository.deleteById(id)
        logger.info("Deleted item with id: {}", id)
    }

    private fun findItemById(id: Long): Item {
        return itemRepository.findById(id).orElseThrow {
            EntityNotFoundException("Item with id $id not found")
        }
    }
}
