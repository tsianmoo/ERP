package com.productmanagement.controller;

import com.productmanagement.dto.*;
import com.productmanagement.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "商品管理", description = "商品相关接口")
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductController {
    
    private final ProductService productService;
    
    @Operation(summary = "获取商品列表", description = "分页获取商品列表")
    @GetMapping
    public ResponseEntity<PageResponse<ProductDTO>> getProducts(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "状态筛选") @RequestParam(required = false) String status) {
        
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        PageResponse<ProductDTO> response = productService.getProducts(pageable, status);
        return ResponseEntity.ok(response);
    }
    
    @Operation(summary = "获取商品详情", description = "根据ID获取商品详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(
            @Parameter(description = "商品ID") @PathVariable Integer id) {
        try {
            ProductDTO product = productService.getProductById(id);
            return ResponseEntity.ok(Map.of("data", product));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建商品", description = "创建新商品")
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody CreateProductRequest request) {
        try {
            ProductDTO product = productService.createProduct(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("data", product));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新商品", description = "更新商品信息")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @Parameter(description = "商品ID") @PathVariable Integer id,
            @RequestBody UpdateProductRequest request) {
        try {
            ProductDTO product = productService.updateProduct(id, request);
            return ResponseEntity.ok(Map.of("data", product));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除商品", description = "删除指定商品")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(
            @Parameter(description = "商品ID") @PathVariable Integer id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
