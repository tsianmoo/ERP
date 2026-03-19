package com.productmanagement.controller;

import com.productmanagement.dto.AttributeValueDTO;
import com.productmanagement.service.AttributeValueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "属性值管理", description = "商品属性值相关接口")
@RestController
@RequestMapping("/api/products/attribute-values")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AttributeValueController {
    
    private final AttributeValueService service;
    
    @Operation(summary = "获取所有属性值")
    @GetMapping
    public ResponseEntity<?> getAllValues() {
        try {
            List<AttributeValueDTO> values = service.getAllValues();
            return ResponseEntity.ok(Map.of("data", values));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取指定属性的值")
    @GetMapping("/attribute/{attributeId}")
    public ResponseEntity<?> getValuesByAttributeId(@PathVariable Integer attributeId) {
        try {
            List<AttributeValueDTO> values = service.getValuesByAttributeId(attributeId);
            return ResponseEntity.ok(Map.of("data", values));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建属性值")
    @PostMapping
    public ResponseEntity<?> createValue(@RequestBody AttributeValueDTO request) {
        try {
            AttributeValueDTO value = service.createValue(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", value));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新属性值")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateValue(@PathVariable Integer id, @RequestBody AttributeValueDTO request) {
        try {
            AttributeValueDTO value = service.updateValue(id, request);
            return ResponseEntity.ok(Map.of("data", value));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除属性值")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteValue(@PathVariable Integer id) {
        try {
            service.deleteValue(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
