package com.productmanagement.controller;

import com.productmanagement.dto.ImageCategoryDTO;
import com.productmanagement.service.ImageCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "图片分类管理", description = "图片分类相关接口")
@RestController
@RequestMapping("/api/images/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ImageCategoryController {
    
    private final ImageCategoryService service;
    
    @Operation(summary = "获取所有图片分类")
    @GetMapping
    public ResponseEntity<?> getAllCategories() {
        try {
            List<ImageCategoryDTO> categories = service.getAllCategories();
            return ResponseEntity.ok(Map.of("data", categories));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取图片分类详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Integer id) {
        try {
            ImageCategoryDTO category = service.getCategoryById(id);
            return ResponseEntity.ok(Map.of("data", category));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建图片分类")
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody ImageCategoryDTO request) {
        try {
            ImageCategoryDTO category = service.createCategory(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", category));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新图片分类")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Integer id, @RequestBody ImageCategoryDTO request) {
        try {
            ImageCategoryDTO category = service.updateCategory(id, request);
            return ResponseEntity.ok(Map.of("data", category));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除图片分类")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Integer id) {
        try {
            service.deleteCategory(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
