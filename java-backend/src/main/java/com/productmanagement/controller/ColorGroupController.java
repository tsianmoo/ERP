package com.productmanagement.controller;

import com.productmanagement.dto.ColorGroupDTO;
import com.productmanagement.service.ColorGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "颜色分组管理", description = "颜色分组相关接口")
@RestController
@RequestMapping("/api/products/color-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ColorGroupController {
    
    private final ColorGroupService service;
    
    @Operation(summary = "获取所有颜色分组")
    @GetMapping
    public ResponseEntity<?> getAllGroups() {
        try {
            List<ColorGroupDTO> groups = service.getAllGroups();
            return ResponseEntity.ok(Map.of("data", groups));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取颜色分组详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(@PathVariable Integer id) {
        try {
            ColorGroupDTO group = service.getGroupById(id);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建颜色分组")
    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody ColorGroupDTO request) {
        try {
            ColorGroupDTO group = service.createGroup(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", group));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新颜色分组")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(@PathVariable Integer id, @RequestBody ColorGroupDTO request) {
        try {
            ColorGroupDTO group = service.updateGroup(id, request);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除颜色分组")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Integer id) {
        try {
            service.deleteGroup(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "颜色分组排序")
    @PostMapping("/reorder")
    public ResponseEntity<?> reorderGroups(@RequestBody Map<String, List<Integer>> request) {
        try {
            List<Integer> groupIds = request.get("groupIds");
            service.reorderGroups(groupIds);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
