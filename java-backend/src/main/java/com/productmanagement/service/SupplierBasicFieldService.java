package com.productmanagement.service;

import com.productmanagement.dto.SupplierBasicFieldDTO;
import java.util.List;

public interface SupplierBasicFieldService {
    
    List<SupplierBasicFieldDTO> getAllFields();
    
    List<SupplierBasicFieldDTO> getEnabledFields();
    
    SupplierBasicFieldDTO getFieldById(Integer id);
    
    SupplierBasicFieldDTO createField(SupplierBasicFieldDTO request);
    
    SupplierBasicFieldDTO updateField(Integer id, SupplierBasicFieldDTO request);
    
    void deleteField(Integer id);
}
