package com.productmanagement.controller;

import com.productmanagement.dto.ProductAttributeDTO;
import com.productmanagement.service.ProductAttributeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "商品属性管理", description = "商品属性相关接口")
@RestController
@RequestMapping("/api/products/attributes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductAttributeController {
    
    private final ProductAttributeService attributeService;
    
    @Operation(summary = "获取所有属性", description = "获取所有商品属性配置")
    @GetMapping
    public ResponseEntity<?> getAllAttributes() {
        try {
            List<ProductAttributeDTO> attributes = attributeService.getAllAttributes();
            return ResponseEntity.ok(Map.of("data", attributes));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取属性详情", description = "根据ID获取属性详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getAttributeById(
            @Parameter(description = "属性ID") @PathVariable Integer id) {
        try {
            ProductAttributeDTO attribute = attributeService.getAttributeById(id);
            return ResponseEntity.ok(Map.of("data", attribute));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建属性", description = "创建新属性")
    @PostMapping
    public ResponseEntity<?> createAttribute(@RequestBody ProductAttributeDTO request) {
        try {
            ProductAttributeDTO attribute = attributeService.createAttribute(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("data", attribute));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新属性", description = "更新属性信息")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAttribute(
            @Parameter(description = "属性ID") @PathVariable Integer id,
            @RequestBody ProductAttributeDTO request) {
        try {
            ProductAttributeDTO attribute = attributeService.updateAttribute(id, request);
            return ResponseEntity.ok(Map.of("data", attribute));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除属性", description = "删除指定属性")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttribute(
            @Parameter(description = "属性ID") @PathVariable Integer id) {
        try {
            attributeService.deleteAttribute(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
