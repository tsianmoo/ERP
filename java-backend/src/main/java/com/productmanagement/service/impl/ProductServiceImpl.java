package com.productmanagement.service.impl;

import com.productmanagement.dto.*;
import com.productmanagement.entity.Product;
import com.productmanagement.repository.ProductRepository;
import com.productmanagement.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    
    private final ProductRepository productRepository;
    
    @Override
    public PageResponse<ProductDTO> getProducts(Pageable pageable, String status) {
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        
        Page<Product> productPage;
        if (status != null && !status.isEmpty()) {
            productPage = productRepository.findByStatus(status, sortedPageable);
        } else {
            productPage = productRepository.findAll(sortedPageable);
        }
        
        List<ProductDTO> products = productPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        return PageResponse.of(products, productPage.getTotalElements(), 
                productPage.getNumber() + 1, productPage.getSize());
    }
    
    @Override
    public ProductDTO getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在: " + id));
        return toDTO(product);
    }
    
    @Override
    @Transactional
    public ProductDTO createProduct(CreateProductRequest request) {
        Product product = new Product();
        product.setBasicInfo(request.getBasicInfo());
        product.setAttributeValues(request.getAttributeValues());
        product.setStatus(request.getStatus() != null ? request.getStatus() : "active");
        
        // 处理 imageUrls 数据：空列表设为 null，避免 JSON 序列化问题
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            product.setImageUrls(request.getImageUrls());
        } else {
            product.setImageUrls(null);
        }
        
        // 处理 colors 数据：空列表设为 null，避免 JSON 序列化问题
        if (request.getColors() != null && !request.getColors().isEmpty()) {
            product.setColorsData(request.getColors());
        } else {
            product.setColorsData(null);
        }
        
        // 处理 sizes 数据：空列表设为 null，避免 JSON 序列化问题
        if (request.getSizes() != null && !request.getSizes().isEmpty()) {
            product.setSizesData(request.getSizes());
        } else {
            product.setSizesData(null);
        }
        
        // 从 basicInfo 中获取 product_code
        if (request.getBasicInfo() != null && request.getBasicInfo().containsKey("product_code")) {
            product.setProductCode(String.valueOf(request.getBasicInfo().get("product_code")));
        }
        
        Product savedProduct = productRepository.save(product);
        log.info("创建商品成功，ID: {}", savedProduct.getId());
        return toDTO(savedProduct);
    }
    
    @Override
    @Transactional
    public ProductDTO updateProduct(Integer id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在: " + id));
        
        if (request.getBasicInfo() != null) {
            product.setBasicInfo(request.getBasicInfo());
        }
        if (request.getAttributeValues() != null) {
            product.setAttributeValues(request.getAttributeValues());
        }
        if (request.getImageUrls() != null) {
            product.setImageUrls(request.getImageUrls());
        }
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }
        if (request.getColors() != null && !request.getColors().isEmpty()) {
            product.setColorsData(request.getColors());
        }
        
        Product updatedProduct = productRepository.save(product);
        log.info("更新商品成功，ID: {}", updatedProduct.getId());
        return toDTO(updatedProduct);
    }
    
    @Override
    @Transactional
    public void deleteProduct(Integer id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("商品不存在: " + id);
        }
        productRepository.deleteById(id);
        log.info("删除商品成功，ID: {}", id);
    }
    
    private ProductDTO toDTO(Product product) {
        return ProductDTO.builder()
                .id(product.getId())
                .productCode(product.getProductCode())
                .productName(product.getProductName())
                .basicInfo(product.getBasicInfo())
                .attributeValues(product.getAttributeValues())
                .imageUrls(product.getImageUrls())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .colorsData(product.getColorsData())
                .sizesData(product.getSizesData())
                .build();
    }
}
