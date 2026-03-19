package com.productmanagement.controller;

import com.productmanagement.dto.ProductAttributeGroupDTO;
import com.productmanagement.service.ProductAttributeGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "商品属性分组管理", description = "商品属性分组相关接口")
@RestController
@RequestMapping("/api/products/attribute-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductAttributeGroupController {
    
    private final ProductAttributeGroupService groupService;
    
    @Operation(summary = "获取所有分组", description = "获取所有属性分组")
    @GetMapping
    public ResponseEntity<?> getAllGroups() {
        try {
            List<ProductAttributeGroupDTO> groups = groupService.getAllGroups();
            return ResponseEntity.ok(Map.of("data", groups));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取分组详情", description = "根据ID获取分组详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(
            @Parameter(description = "分组ID") @PathVariable Integer id) {
        try {
            ProductAttributeGroupDTO group = groupService.getGroupById(id);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建分组", description = "创建新分组")
    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody ProductAttributeGroupDTO request) {
        try {
            ProductAttributeGroupDTO group = groupService.createGroup(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("data", group));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新分组", description = "更新分组信息")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(
            @Parameter(description = "分组ID") @PathVariable Integer id,
            @RequestBody ProductAttributeGroupDTO request) {
        try {
            ProductAttributeGroupDTO group = groupService.updateGroup(id, request);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除分组", description = "删除指定分组")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(
            @Parameter(description = "分组ID") @PathVariable Integer id) {
        try {
            groupService.deleteGroup(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
