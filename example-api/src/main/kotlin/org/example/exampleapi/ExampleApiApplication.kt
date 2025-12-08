package org.example.exampleapi

import org.example.exampleapi.config.AppProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.data.web.config.EnableSpringDataWebSupport
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO

@SpringBootApplication
@EnableConfigurationProperties(AppProperties::class)
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
class ExampleApiApplication

fun main(args: Array<String>) {
    runApplication<ExampleApiApplication>(*args)
}