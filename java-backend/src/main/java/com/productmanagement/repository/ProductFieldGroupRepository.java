package com.productmanagement.repository;

import com.productmanagement.entity.ProductFieldGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductFieldGroupRepository extends JpaRepository<ProductFieldGroup, Integer> {
    
    List<ProductFieldGroup> findAllByOrderBySortOrderAsc();
}
