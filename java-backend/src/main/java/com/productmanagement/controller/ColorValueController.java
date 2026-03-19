package com.productmanagement.controller;

import com.productmanagement.dto.ColorValueDTO;
import com.productmanagement.service.ColorValueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "颜色值管理", description = "颜色值相关接口")
@RestController
@RequestMapping("/api/products/color-values")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ColorValueController {
    
    private final ColorValueService service;
    
    @Operation(summary = "获取所有颜色值")
    @GetMapping
    public ResponseEntity<?> getAllValues() {
        try {
            List<ColorValueDTO> values = service.getAllValues();
            return ResponseEntity.ok(Map.of("data", values));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "根据分组ID获取颜色值")
    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getValuesByGroupId(@PathVariable Integer groupId) {
        try {
            List<ColorValueDTO> values = service.getValuesByGroupId(groupId);
            return ResponseEntity.ok(Map.of("data", values));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取颜色值详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getValueById(@PathVariable Integer id) {
        try {
            ColorValueDTO value = service.getValueById(id);
            return ResponseEntity.ok(Map.of("data", value));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建颜色值")
    @PostMapping
    public ResponseEntity<?> createValue(@RequestBody ColorValueDTO request) {
        try {
            ColorValueDTO value = service.createValue(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", value));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新颜色值")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateValue(@PathVariable Integer id, @RequestBody ColorValueDTO request) {
        try {
            ColorValueDTO value = service.updateValue(id, request);
            return ResponseEntity.ok(Map.of("data", value));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除颜色值")
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
