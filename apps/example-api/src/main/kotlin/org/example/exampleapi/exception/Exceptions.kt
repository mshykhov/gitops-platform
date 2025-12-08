package org.example.exampleapi.exception

class EntityNotFoundException(message: String) : RuntimeException(message)

class ValidationException(message: String) : RuntimeException(message)
