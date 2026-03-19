package com.productmanagement.controller;

import com.productmanagement.dto.SupplierBasicFieldDTO;
import com.productmanagement.service.SupplierBasicFieldService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "供应商基本字段管理", description = "供应商基本字段相关接口")
@RestController
@RequestMapping("/api/suppliers/basic-fields")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SupplierBasicFieldController {
    
    private final SupplierBasicFieldService service;
    
    @Operation(summary = "获取所有供应商字段")
    @GetMapping
    public ResponseEntity<?> getAllFields() {
        try {
            List<SupplierBasicFieldDTO> fields = service.getAllFields();
            return ResponseEntity.ok(Map.of("data", fields));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取启用的供应商字段")
    @GetMapping("/enabled")
    public ResponseEntity<?> getEnabledFields() {
        try {
            List<SupplierBasicFieldDTO> fields = service.getEnabledFields();
            return ResponseEntity.ok(Map.of("data", fields));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取供应商字段详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getFieldById(@PathVariable Integer id) {
        try {
            SupplierBasicFieldDTO field = service.getFieldById(id);
            return ResponseEntity.ok(Map.of("data", field));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建供应商字段")
    @PostMapping
    public ResponseEntity<?> createField(@RequestBody SupplierBasicFieldDTO request) {
        try {
            SupplierBasicFieldDTO field = service.createField(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", field));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新供应商字段")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateField(@PathVariable Integer id, @RequestBody SupplierBasicFieldDTO request) {
        try {
            SupplierBasicFieldDTO field = service.updateField(id, request);
            return ResponseEntity.ok(Map.of("data", field));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除供应商字段")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteField(@PathVariable Integer id) {
        try {
            service.deleteField(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
