package com.productmanagement.controller;

import com.productmanagement.dto.SizeGroupDTO;
import com.productmanagement.service.SizeGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "尺码分组管理", description = "尺码分组相关接口")
@RestController
@RequestMapping("/api/products/size-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SizeGroupController {
    
    private final SizeGroupService service;
    
    @Operation(summary = "获取所有尺码分组")
    @GetMapping
    public ResponseEntity<?> getAllGroups() {
        try {
            List<SizeGroupDTO> groups = service.getAllGroups();
            return ResponseEntity.ok(Map.of("data", groups));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取尺码分组详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(@PathVariable Integer id) {
        try {
            SizeGroupDTO group = service.getGroupById(id);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建尺码分组")
    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody SizeGroupDTO request) {
        try {
            SizeGroupDTO group = service.createGroup(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", group));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新尺码分组")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(@PathVariable Integer id, @RequestBody SizeGroupDTO request) {
        try {
            SizeGroupDTO group = service.updateGroup(id, request);
            return ResponseEntity.ok(Map.of("data", group));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除尺码分组")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Integer id) {
        try {
            service.deleteGroup(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "尺码分组排序")
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
