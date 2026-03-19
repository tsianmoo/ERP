package com.productmanagement.controller;

import com.productmanagement.dto.SizeValueDTO;
import com.productmanagement.service.SizeValueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "尺码值管理", description = "尺码值相关接口")
@RestController
@RequestMapping("/api/products/size-values")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SizeValueController {
    
    private final SizeValueService service;
    
    @Operation(summary = "获取所有尺码值")
    @GetMapping
    public ResponseEntity<?> getAllValues() {
        try {
            List<SizeValueDTO> values = service.getAllValues();
            return ResponseEntity.ok(Map.of("data", values));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "根据分组ID获取尺码值")
    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getValuesByGroupId(@PathVariable Integer groupId) {
        try {
            List<SizeValueDTO> values = service.getValuesByGroupId(groupId);
            return ResponseEntity.ok(Map.of("data", values));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取尺码值详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getValueById(@PathVariable Integer id) {
        try {
            SizeValueDTO value = service.getValueById(id);
            return ResponseEntity.ok(Map.of("data", value));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建尺码值")
    @PostMapping
    public ResponseEntity<?> createValue(@RequestBody SizeValueDTO request) {
        try {
            SizeValueDTO value = service.createValue(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", value));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新尺码值")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateValue(@PathVariable Integer id, @RequestBody SizeValueDTO request) {
        try {
            SizeValueDTO value = service.updateValue(id, request);
            return ResponseEntity.ok(Map.of("data", value));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除尺码值")
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
