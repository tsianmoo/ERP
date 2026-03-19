package com.productmanagement.controller;

import com.productmanagement.dto.SupplierDTO;
import com.productmanagement.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "供应商管理", description = "供应商相关接口")
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SupplierController {
    
    private final SupplierService service;
    
    @Operation(summary = "获取所有供应商")
    @GetMapping
    public ResponseEntity<?> getAllSuppliers() {
        try {
            List<SupplierDTO> suppliers = service.getAllSuppliers();
            return ResponseEntity.ok(Map.of("data", suppliers));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取供应商详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getSupplierById(@PathVariable Integer id) {
        try {
            SupplierDTO supplier = service.getSupplierById(id);
            return ResponseEntity.ok(Map.of("data", supplier));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建供应商")
    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody SupplierDTO request) {
        try {
            SupplierDTO supplier = service.createSupplier(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", supplier));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新供应商")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(@PathVariable Integer id, @RequestBody SupplierDTO request) {
        try {
            SupplierDTO supplier = service.updateSupplier(id, request);
            return ResponseEntity.ok(Map.of("data", supplier));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除供应商")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Integer id) {
        try {
            service.deleteSupplier(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
