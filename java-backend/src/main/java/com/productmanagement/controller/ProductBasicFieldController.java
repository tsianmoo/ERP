package com.productmanagement.controller;

import com.productmanagement.dto.ProductBasicFieldDTO;
import com.productmanagement.service.ProductBasicFieldService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "商品基本字段管理", description = "商品基本字段相关接口")
@RestController
@RequestMapping("/api/products/basic-fields")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductBasicFieldController {
    
    private final ProductBasicFieldService fieldService;
    
    @Operation(summary = "获取所有字段", description = "获取所有商品基本字段配置")
    @GetMapping
    public ResponseEntity<?> getAllFields() {
        try {
            List<ProductBasicFieldDTO> fields = fieldService.getAllFields();
            return ResponseEntity.ok(Map.of("data", fields));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取字段详情", description = "根据ID获取字段详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getFieldById(
            @Parameter(description = "字段ID") @PathVariable Integer id) {
        try {
            ProductBasicFieldDTO field = fieldService.getFieldById(id);
            return ResponseEntity.ok(Map.of("data", field));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建字段", description = "创建新字段")
    @PostMapping
    public ResponseEntity<?> createField(@RequestBody ProductBasicFieldDTO request) {
        try {
            ProductBasicFieldDTO field = fieldService.createField(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("data", field));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新字段", description = "更新字段信息")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateField(
            @Parameter(description = "字段ID") @PathVariable Integer id,
            @RequestBody ProductBasicFieldDTO request) {
        try {
            ProductBasicFieldDTO field = fieldService.updateField(id, request);
            return ResponseEntity.ok(Map.of("data", field));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除字段", description = "删除指定字段")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteField(
            @Parameter(description = "字段ID") @PathVariable Integer id) {
        try {
            fieldService.deleteField(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
