package com.productmanagement.service;

import com.productmanagement.dto.ProductBasicFieldDTO;

import java.util.List;

public interface ProductBasicFieldService {
    
    List<ProductBasicFieldDTO> getAllFields();
    
    ProductBasicFieldDTO getFieldById(Integer id);
    
    ProductBasicFieldDTO createField(ProductBasicFieldDTO request);
    
    ProductBasicFieldDTO updateField(Integer id, ProductBasicFieldDTO request);
    
    void deleteField(Integer id);
}
