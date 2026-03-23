package com.productmanagement.controller;

import com.productmanagement.dto.SupplierAttributeValueDTO;
import com.productmanagement.service.SupplierAttributeValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers/attribute-values")
@RequiredArgsConstructor
public class SupplierAttributeValueController {
    
    private final SupplierAttributeValueService valueService;
    
    @GetMapping
    public ResponseEntity<List<SupplierAttributeValueDTO>> getAllValues() {
        return ResponseEntity.ok(valueService.getAllValues());
    }
    
    @GetMapping("/attribute/{attributeId}")
    public ResponseEntity<List<SupplierAttributeValueDTO>> getValuesByAttributeId(@PathVariable Integer attributeId) {
        return ResponseEntity.ok(valueService.getValuesByAttributeId(attributeId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupplierAttributeValueDTO> getValueById(@PathVariable Integer id) {
        return ResponseEntity.ok(valueService.getValueById(id));
    }
    
    @PostMapping
    public ResponseEntity<SupplierAttributeValueDTO> createValue(@RequestBody SupplierAttributeValueDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(valueService.createValue(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupplierAttributeValueDTO> updateValue(@PathVariable Integer id, @RequestBody SupplierAttributeValueDTO request) {
        return ResponseEntity.ok(valueService.updateValue(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteValue(@PathVariable Integer id) {
        valueService.deleteValue(id);
        return ResponseEntity.noContent().build();
    }
}
