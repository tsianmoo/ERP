package com.productmanagement.controller;

import com.productmanagement.dto.ImageDTO;
import com.productmanagement.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "图片管理", description = "图片相关接口")
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ImageController {
    
    private final ImageService service;
    
    @Operation(summary = "获取所有图片")
    @GetMapping
    public ResponseEntity<?> getAllImages() {
        try {
            List<ImageDTO> images = service.getAllImages();
            return ResponseEntity.ok(Map.of("data", images));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取指定分类的图片")
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<?> getImagesByCategory(@PathVariable Integer categoryId) {
        try {
            List<ImageDTO> images = service.getImagesByCategory(categoryId);
            return ResponseEntity.ok(Map.of("data", images));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取图片详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getImageById(@PathVariable Integer id) {
        try {
            ImageDTO image = service.getImageById(id);
            return ResponseEntity.ok(Map.of("data", image));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建图片记录")
    @PostMapping
    public ResponseEntity<?> createImage(@RequestBody ImageDTO request) {
        try {
            ImageDTO image = service.createImage(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", image));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新图片信息")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateImage(@PathVariable Integer id, @RequestBody ImageDTO request) {
        try {
            ImageDTO image = service.updateImage(id, request);
            return ResponseEntity.ok(Map.of("data", image));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除图片")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteImage(@PathVariable Integer id) {
        try {
            service.deleteImage(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
