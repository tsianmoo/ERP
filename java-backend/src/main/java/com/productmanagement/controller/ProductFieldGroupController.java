package com.productmanagement.controller;

import com.productmanagement.dto.ProductFieldGroupDTO;
import com.productmanagement.service.ProductFieldGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "商品字段分组管理", description = "商品字段分组相关接口")
@RestController
@RequestMapping("/api/products/field-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductFieldGroupController {
    
    private final ProductFieldGroupService service;
    
    @Operation(summary = "获取所有字段分组")
    @GetMapping
    public ResponseEntity<?> getAllGroups() {
        try {
            List<ProductFieldGroupDTO> groups = service.getAllGroups();
            return ResponseEntity.ok(Map.of("data", groups));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取字段分组详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(@PathVariable Integer id) {
        try {
            ProductFieldGroupDTO group = service.getGroupById(id);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建字段分组")
    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody ProductFieldGroupDTO request) {
        try {
            ProductFieldGroupDTO group = service.createGroup(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", group));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新字段分组")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(@PathVariable Integer id, @RequestBody ProductFieldGroupDTO request) {
        try {
            ProductFieldGroupDTO group = service.updateGroup(id, request);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除字段分组")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Integer id) {
        try {
            service.deleteGroup(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
