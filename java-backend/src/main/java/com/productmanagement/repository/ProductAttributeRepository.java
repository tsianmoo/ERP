package com.productmanagement.repository;

import com.productmanagement.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Integer> {
    
    List<ProductAttribute> findByEnabledTrueOrderBySortOrderAsc();
    
    List<ProductAttribute> findByGroupIdOrderBySortOrderAsc(Integer groupId);
    
    List<ProductAttribute> findByGroupIdIsNullOrderBySortOrderAsc();
    
    @Query("SELECT pa FROM ProductAttribute pa LEFT JOIN FETCH pa.group ORDER BY pa.sortOrder ASC")
    List<ProductAttribute> findAllWithGroupOrderBySortOrder();
    
    boolean existsByCode(String code);
}
