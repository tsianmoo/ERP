package com.productmanagement.service;

import com.productmanagement.dto.SupplierDTO;

import java.util.List;

public interface SupplierService {
    
    List<SupplierDTO> getAllSuppliers();
    
    SupplierDTO getSupplierById(Integer id);
    
    SupplierDTO createSupplier(SupplierDTO request);
    
    SupplierDTO updateSupplier(Integer id, SupplierDTO request);
    
    void deleteSupplier(Integer id);
}
