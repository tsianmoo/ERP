package com.productmanagement.service;

import com.productmanagement.dto.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    
    PageResponse<ProductDTO> getProducts(Pageable pageable, String status);
    
    ProductDTO getProductById(Integer id);
    
    ProductDTO createProduct(CreateProductRequest request);
    
    ProductDTO updateProduct(Integer id, UpdateProductRequest request);
    
    void deleteProduct(Integer id);
}
