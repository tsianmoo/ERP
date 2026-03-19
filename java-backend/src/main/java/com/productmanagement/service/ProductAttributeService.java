package com.productmanagement.service;

import com.productmanagement.dto.ProductAttributeDTO;

import java.util.List;

public interface ProductAttributeService {
    
    List<ProductAttributeDTO> getAllAttributes();
    
    ProductAttributeDTO getAttributeById(Integer id);
    
    ProductAttributeDTO createAttribute(ProductAttributeDTO request);
    
    ProductAttributeDTO updateAttribute(Integer id, ProductAttributeDTO request);
    
    void deleteAttribute(Integer id);
}
