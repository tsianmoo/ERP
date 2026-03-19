package com.productmanagement.service;

import com.productmanagement.dto.AttributeValueDTO;

import java.util.List;

public interface AttributeValueService {
    
    List<AttributeValueDTO> getAllValues();
    
    List<AttributeValueDTO> getValuesByAttributeId(Integer attributeId);
    
    AttributeValueDTO createValue(AttributeValueDTO request);
    
    AttributeValueDTO updateValue(Integer id, AttributeValueDTO request);
    
    void deleteValue(Integer id);
}
